from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="POS Rider System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "rider"  # rider, admin, super_admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Category Models
class CategoryCreate(BaseModel):
    name: str

class CategoryResponse(BaseModel):
    id: str
    name: str
    created_at: Optional[str] = None

# Product Models
class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    price: float
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    min_stock: int = 10

class ProductResponse(BaseModel):
    id: str
    name: str
    sku: Optional[str] = None
    price: float
    stock_in_warehouse: int
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    min_stock: int = 10
    created_at: Optional[str] = None

# Production Models
class ProductionCreate(BaseModel):
    product_id: str
    quantity: int
    notes: Optional[str] = None

# Distribution Models
class DistributionItem(BaseModel):
    product_id: str
    quantity: int

class DistributionCreate(BaseModel):
    rider_id: str
    items: List[DistributionItem]
    notes: Optional[str] = None

# Transaction Models
class TransactionItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class TransactionCreate(BaseModel):
    items: List[TransactionItem]
    payment_method: str = "tunai"
    notes: Optional[str] = None

# Return Models
class ReturnCreate(BaseModel):
    product_id: str
    quantity: int
    notes: Optional[str] = None

# Reject Models
class RejectCreate(BaseModel):
    product_id: str
    quantity: int
    notes: Optional[str] = None

# Stock Opname Models
class StockOpnameItem(BaseModel):
    product_id: str
    remaining_quantity: int

class StockOpnameCreate(BaseModel):
    rider_id: str
    items: List[StockOpnameItem]
    notes: Optional[str] = None

# GPS Model
class GPSUpdate(BaseModel):
    latitude: float
    longitude: float

# Profile Update Model
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from database
        result = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")
        
        user = result.data[0]
        
        # Get user role
        role_result = supabase.table("user_roles").select("role").eq("user_id", user_id).execute()
        user["role"] = role_result.data[0]["role"] if role_result.data else "rider"
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_super_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    try:
        # Check if email already exists
        existing = supabase.table("profiles").select("id").eq("email", user_data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(user_data.password)
        
        # Create profile
        profile_data = {
            "id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "password_hash": hashed_password,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("profiles").insert(profile_data).execute()
        
        # Create user role
        role_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "role": user_data.role
        }
        supabase.table("user_roles").insert(role_data).execute()
        
        # Generate token
        access_token = create_access_token({"sub": user_id})
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user_id,
                email=user_data.email,
                full_name=user_data.full_name,
                phone=user_data.phone,
                role=user_data.role
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    try:
        # Get user by email
        result = supabase.table("profiles").select("*").eq("email", credentials.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user = result.data[0]
        
        # Verify password
        if not verify_password(credentials.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Get user role
        role_result = supabase.table("user_roles").select("role").eq("user_id", user["id"]).execute()
        role = role_result.data[0]["role"] if role_result.data else "rider"
        
        # Generate token
        access_token = create_access_token({"sub": user["id"]})
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=user["id"],
                email=user["email"],
                full_name=user["full_name"],
                phone=user.get("phone"),
                role=role,
                avatar_url=user.get("avatar_url"),
                created_at=user.get("created_at")
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        phone=user.get("phone"),
        role=user.get("role", "rider"),
        avatar_url=user.get("avatar_url"),
        created_at=user.get("created_at")
    )

@api_router.put("/auth/profile")
async def update_profile(profile_data: ProfileUpdate, user: dict = Depends(get_current_user)):
    try:
        update_data = {}
        if profile_data.full_name:
            update_data["full_name"] = profile_data.full_name
        if profile_data.phone:
            update_data["phone"] = profile_data.phone
        if profile_data.avatar_url:
            update_data["avatar_url"] = profile_data.avatar_url
        
        if update_data:
            supabase.table("profiles").update(update_data).eq("id", user["id"]).execute()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(user: dict = Depends(get_current_user)):
    try:
        result = supabase.table("categories").select("*").order("name").execute()
        return [CategoryResponse(**cat) for cat in result.data]
    except Exception as e:
        logger.error(f"Get categories error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user: dict = Depends(require_admin)):
    try:
        cat_id = str(uuid.uuid4())
        data = {
            "id": cat_id,
            "name": category.name,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("categories").insert(data).execute()
        return CategoryResponse(**data)
    except Exception as e:
        logger.error(f"Create category error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, user: dict = Depends(require_admin)):
    try:
        supabase.table("categories").delete().eq("id", category_id).execute()
        return {"message": "Category deleted successfully"}
    except Exception as e:
        logger.error(f"Delete category error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(user: dict = Depends(get_current_user)):
    try:
        result = supabase.table("products").select("*, categories(name)").order("name").execute()
        products = []
        for p in result.data:
            cat_name = p.get("categories", {}).get("name") if p.get("categories") else None
            products.append(ProductResponse(
                id=p["id"],
                name=p["name"],
                sku=p.get("sku"),
                price=p["price"],
                stock_in_warehouse=p.get("stock_in_warehouse", 0),
                category_id=p.get("category_id"),
                category_name=cat_name,
                image_url=p.get("image_url"),
                min_stock=p.get("min_stock", 10),
                created_at=p.get("created_at")
            ))
        return products
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: dict = Depends(require_admin)):
    try:
        prod_id = str(uuid.uuid4())
        data = {
            "id": prod_id,
            "name": product.name,
            "sku": product.sku,
            "price": product.price,
            "stock_in_warehouse": 0,
            "category_id": product.category_id,
            "image_url": product.image_url,
            "min_stock": product.min_stock,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("products").insert(data).execute()
        return ProductResponse(**data)
    except Exception as e:
        logger.error(f"Create product error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, user: dict = Depends(require_admin)):
    try:
        update_data = {
            "name": product.name,
            "sku": product.sku,
            "price": product.price,
            "category_id": product.category_id,
            "image_url": product.image_url,
            "min_stock": product.min_stock
        }
        result = supabase.table("products").update(update_data).eq("id", product_id).execute()
        if result.data:
            return ProductResponse(**result.data[0])
        raise HTTPException(status_code=404, detail="Product not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update product error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(require_admin)):
    try:
        supabase.table("products").delete().eq("id", product_id).execute()
        return {"message": "Product deleted successfully"}
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PRODUCTION ROUTES ====================

@api_router.post("/productions")
async def create_production(production: ProductionCreate, user: dict = Depends(require_admin)):
    try:
        # Get current product
        result = supabase.table("products").select("stock_in_warehouse").eq("id", production.product_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        current_stock = result.data[0]["stock_in_warehouse"]
        new_stock = current_stock + production.quantity
        
        # Update product stock
        supabase.table("products").update({"stock_in_warehouse": new_stock}).eq("id", production.product_id).execute()
        
        # Record production history
        prod_record = {
            "id": str(uuid.uuid4()),
            "product_id": production.product_id,
            "quantity": production.quantity,
            "admin_id": user["id"],
            "notes": production.notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("productions").insert(prod_record).execute()
        
        return {"message": "Production recorded successfully", "new_stock": new_stock}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Production error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/productions")
async def get_productions(user: dict = Depends(require_admin)):
    try:
        result = supabase.table("productions").select("*, products(name), profiles(full_name)").order("created_at", desc=True).limit(100).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get productions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DISTRIBUTION ROUTES ====================

@api_router.post("/distributions")
async def create_distribution(dist: DistributionCreate, user: dict = Depends(require_admin)):
    try:
        for item in dist.items:
            # Check warehouse stock
            prod_result = supabase.table("products").select("stock_in_warehouse, name").eq("id", item.product_id).execute()
            if not prod_result.data:
                raise HTTPException(status_code=404, detail=f"Product not found")
            
            warehouse_stock = prod_result.data[0]["stock_in_warehouse"]
            if warehouse_stock < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock for {prod_result.data[0]['name']}. Available: {warehouse_stock}"
                )
            
            # Decrease warehouse stock
            supabase.table("products").update({
                "stock_in_warehouse": warehouse_stock - item.quantity
            }).eq("id", item.product_id).execute()
            
            # Get current rider stock
            rider_stock = supabase.table("rider_stock").select("quantity").eq("rider_id", dist.rider_id).eq("product_id", item.product_id).execute()
            
            if rider_stock.data:
                # Update existing rider stock
                new_qty = rider_stock.data[0]["quantity"] + item.quantity
                supabase.table("rider_stock").update({"quantity": new_qty}).eq("rider_id", dist.rider_id).eq("product_id", item.product_id).execute()
            else:
                # Create new rider stock
                supabase.table("rider_stock").insert({
                    "id": str(uuid.uuid4()),
                    "rider_id": dist.rider_id,
                    "product_id": item.product_id,
                    "quantity": item.quantity
                }).execute()
            
            # Record distribution history
            supabase.table("distributions").insert({
                "id": str(uuid.uuid4()),
                "rider_id": dist.rider_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "admin_id": user["id"],
                "notes": dist.notes,
                "distributed_at": datetime.now(timezone.utc).isoformat()
            }).execute()
        
        return {"message": "Distribution successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Distribution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/distributions")
async def get_distributions(
    rider_id: Optional[str] = None, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    try:
        query = supabase.table("distributions").select("*, products(name), rider:profiles!distributions_rider_id_fkey(full_name), admin:profiles!distributions_admin_id_fkey(full_name)")
        
        if rider_id:
            query = query.eq("rider_id", rider_id)
        if start_date:
            query = query.gte("distributed_at", start_date)
        if end_date:
            query = query.lte("distributed_at", end_date)
        
        result = query.order("distributed_at", desc=True).limit(500).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get distributions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RIDER STOCK ROUTES ====================

@api_router.get("/rider-stock")
async def get_rider_stock(user: dict = Depends(get_current_user)):
    """Get current user's stock (for rider) or all rider stocks (for admin)"""
    try:
        if user.get("role") in ["admin", "super_admin"]:
            result = supabase.table("rider_stock").select("*, products(name, price, image_url), profiles(full_name)").execute()
        else:
            result = supabase.table("rider_stock").select("*, products(name, price, image_url)").eq("rider_id", user["id"]).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get rider stock error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/rider-stock/{rider_id}")
async def get_rider_stock_by_id(rider_id: str, user: dict = Depends(require_admin)):
    """Get specific rider's stock (admin only)"""
    try:
        result = supabase.table("rider_stock").select("*, products(name, price, image_url)").eq("rider_id", rider_id).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get rider stock error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TRANSACTION ROUTES (POS) ====================

@api_router.post("/transactions")
async def create_transaction(trans: TransactionCreate, user: dict = Depends(get_current_user)):
    try:
        trans_id = str(uuid.uuid4())
        total_amount = 0
        
        # Validate and prepare items
        for item in trans.items:
            # Check rider stock
            stock_result = supabase.table("rider_stock").select("quantity").eq("rider_id", user["id"]).eq("product_id", item.product_id).execute()
            
            if not stock_result.data or stock_result.data[0]["quantity"] < item.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock")
            
            total_amount += item.price * item.quantity
        
        # Create transaction
        supabase.table("transactions").insert({
            "id": trans_id,
            "rider_id": user["id"],
            "total_amount": total_amount,
            "payment_method": trans.payment_method,
            "notes": trans.notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Create transaction items and update stock
        for item in trans.items:
            # Insert transaction item
            supabase.table("transaction_items").insert({
                "id": str(uuid.uuid4()),
                "transaction_id": trans_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price": item.price,
                "subtotal": item.price * item.quantity
            }).execute()
            
            # Update rider stock
            stock_result = supabase.table("rider_stock").select("quantity").eq("rider_id", user["id"]).eq("product_id", item.product_id).execute()
            new_qty = stock_result.data[0]["quantity"] - item.quantity
            
            if new_qty <= 0:
                supabase.table("rider_stock").delete().eq("rider_id", user["id"]).eq("product_id", item.product_id).execute()
            else:
                supabase.table("rider_stock").update({"quantity": new_qty}).eq("rider_id", user["id"]).eq("product_id", item.product_id).execute()
        
        return {"message": "Transaction successful", "transaction_id": trans_id, "total": total_amount}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transaction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/transactions")
async def get_transactions(
    rider_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    try:
        if user.get("role") in ["admin", "super_admin"]:
            query = supabase.table("transactions").select("*, profiles(full_name)")
            if rider_id:
                query = query.eq("rider_id", rider_id)
        else:
            query = supabase.table("transactions").select("*").eq("rider_id", user["id"])
        
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        
        result = query.order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/transactions/{transaction_id}")
async def get_transaction_detail(transaction_id: str, user: dict = Depends(get_current_user)):
    try:
        # Get transaction
        trans = supabase.table("transactions").select("*, profiles(full_name)").eq("id", transaction_id).execute()
        if not trans.data:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get items
        items = supabase.table("transaction_items").select("*, products(name)").eq("transaction_id", transaction_id).execute()
        
        result = trans.data[0]
        result["items"] = items.data
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get transaction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RETURN ROUTES ====================

@api_router.post("/returns")
async def create_return(ret: ReturnCreate, user: dict = Depends(get_current_user)):
    try:
        # Check rider stock
        stock_result = supabase.table("rider_stock").select("quantity").eq("rider_id", user["id"]).eq("product_id", ret.product_id).execute()
        
        if not stock_result.data or stock_result.data[0]["quantity"] < ret.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock for return")
        
        # Create return request
        return_data = {
            "id": str(uuid.uuid4()),
            "rider_id": user["id"],
            "product_id": ret.product_id,
            "quantity": ret.quantity,
            "notes": ret.notes,
            "status": "pending",
            "returned_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("returns").insert(return_data).execute()
        
        return {"message": "Return request submitted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Return error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/returns")
async def get_returns(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    try:
        if user.get("role") in ["admin", "super_admin"]:
            query = supabase.table("returns").select("*, products(name, price), profiles(full_name)")
        else:
            query = supabase.table("returns").select("*, products(name, price)").eq("rider_id", user["id"])
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("returned_at", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get returns error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/returns/{return_id}/approve")
async def approve_return(return_id: str, user: dict = Depends(require_admin)):
    try:
        # Get return request
        ret = supabase.table("returns").select("*").eq("id", return_id).execute()
        if not ret.data:
            raise HTTPException(status_code=404, detail="Return not found")
        
        return_data = ret.data[0]
        
        # Update rider stock (decrease)
        stock = supabase.table("rider_stock").select("quantity").eq("rider_id", return_data["rider_id"]).eq("product_id", return_data["product_id"]).execute()
        if stock.data:
            new_qty = stock.data[0]["quantity"] - return_data["quantity"]
            if new_qty <= 0:
                supabase.table("rider_stock").delete().eq("rider_id", return_data["rider_id"]).eq("product_id", return_data["product_id"]).execute()
            else:
                supabase.table("rider_stock").update({"quantity": new_qty}).eq("rider_id", return_data["rider_id"]).eq("product_id", return_data["product_id"]).execute()
        
        # Update warehouse stock (increase)
        product = supabase.table("products").select("stock_in_warehouse").eq("id", return_data["product_id"]).execute()
        new_warehouse_stock = product.data[0]["stock_in_warehouse"] + return_data["quantity"]
        supabase.table("products").update({"stock_in_warehouse": new_warehouse_stock}).eq("id", return_data["product_id"]).execute()
        
        # Update return status
        supabase.table("returns").update({
            "status": "approved",
            "approved_by": user["id"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", return_id).execute()
        
        # Record in return history
        supabase.table("return_history").insert({
            "id": str(uuid.uuid4()),
            "rider_id": return_data["rider_id"],
            "product_id": return_data["product_id"],
            "quantity": return_data["quantity"],
            "notes": return_data["notes"],
            "status": "approved",
            "approved_by": user["id"],
            "returned_at": return_data["returned_at"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Delete from returns
        supabase.table("returns").delete().eq("id", return_id).execute()
        
        return {"message": "Return approved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approve return error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/returns/{return_id}/reject")
async def reject_return(return_id: str, user: dict = Depends(require_admin)):
    try:
        ret = supabase.table("returns").select("*").eq("id", return_id).execute()
        if not ret.data:
            raise HTTPException(status_code=404, detail="Return not found")
        
        return_data = ret.data[0]
        
        # Record in return history
        supabase.table("return_history").insert({
            "id": str(uuid.uuid4()),
            "rider_id": return_data["rider_id"],
            "product_id": return_data["product_id"],
            "quantity": return_data["quantity"],
            "notes": return_data["notes"],
            "status": "rejected",
            "approved_by": user["id"],
            "returned_at": return_data["returned_at"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Delete from returns
        supabase.table("returns").delete().eq("id", return_id).execute()
        
        return {"message": "Return rejected"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject return error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== REJECT (DAMAGED PRODUCTS) ROUTES ====================

@api_router.post("/rejects")
async def create_reject(rej: RejectCreate, user: dict = Depends(get_current_user)):
    try:
        # Check rider stock
        stock_result = supabase.table("rider_stock").select("quantity").eq("rider_id", user["id"]).eq("product_id", rej.product_id).execute()
        
        if not stock_result.data or stock_result.data[0]["quantity"] < rej.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock for reject")
        
        # Create reject request
        reject_data = {
            "id": str(uuid.uuid4()),
            "rider_id": user["id"],
            "product_id": rej.product_id,
            "quantity": rej.quantity,
            "notes": rej.notes,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        supabase.table("rejects").insert(reject_data).execute()
        
        return {"message": "Reject request submitted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reject error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/rejects")
async def get_rejects(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    try:
        if user.get("role") in ["admin", "super_admin"]:
            query = supabase.table("rejects").select("*, products(name, price), profiles(full_name)")
        else:
            query = supabase.table("rejects").select("*, products(name, price)").eq("rider_id", user["id"])
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get rejects error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/rejects/{reject_id}/approve")
async def approve_reject(reject_id: str, user: dict = Depends(require_admin)):
    try:
        # Get reject request
        rej = supabase.table("rejects").select("*").eq("id", reject_id).execute()
        if not rej.data:
            raise HTTPException(status_code=404, detail="Reject not found")
        
        reject_data = rej.data[0]
        
        # Update rider stock (decrease) - Product is lost, NOT returned to warehouse
        stock = supabase.table("rider_stock").select("quantity").eq("rider_id", reject_data["rider_id"]).eq("product_id", reject_data["product_id"]).execute()
        if stock.data:
            new_qty = stock.data[0]["quantity"] - reject_data["quantity"]
            if new_qty <= 0:
                supabase.table("rider_stock").delete().eq("rider_id", reject_data["rider_id"]).eq("product_id", reject_data["product_id"]).execute()
            else:
                supabase.table("rider_stock").update({"quantity": new_qty}).eq("rider_id", reject_data["rider_id"]).eq("product_id", reject_data["product_id"]).execute()
        
        # Record in reject history (for loss calculation)
        supabase.table("reject_history").insert({
            "id": str(uuid.uuid4()),
            "rider_id": reject_data["rider_id"],
            "product_id": reject_data["product_id"],
            "quantity": reject_data["quantity"],
            "notes": reject_data["notes"],
            "status": "approved",
            "approved_by": user["id"],
            "created_at": reject_data["created_at"],
            "approved_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        # Delete from rejects
        supabase.table("rejects").delete().eq("id", reject_id).execute()
        
        return {"message": "Reject approved - Product marked as loss"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Approve reject error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STOCK OPNAME ROUTES ====================

@api_router.post("/stock-opname")
async def create_stock_opname(opname: StockOpnameCreate, user: dict = Depends(require_admin)):
    """
    Stock Opname: Input remaining stock, auto-calculate sales
    Used for riders without phones or end-of-day reconciliation
    """
    try:
        opname_id = str(uuid.uuid4())
        total_sales = 0
        sales_records = []
        
        for item in opname.items:
            # Get current rider stock (before opname)
            stock = supabase.table("rider_stock").select("quantity").eq("rider_id", opname.rider_id).eq("product_id", item.product_id).execute()
            
            if stock.data:
                current_stock = stock.data[0]["quantity"]
                sold_quantity = current_stock - item.remaining_quantity
                
                if sold_quantity < 0:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Remaining stock cannot be more than distributed stock"
                    )
                
                # Get product price for sales calculation
                product = supabase.table("products").select("price, name").eq("id", item.product_id).execute()
                if product.data:
                    sale_amount = sold_quantity * product.data[0]["price"]
                    total_sales += sale_amount
                    
                    if sold_quantity > 0:
                        sales_records.append({
                            "product_id": item.product_id,
                            "product_name": product.data[0]["name"],
                            "quantity_sold": sold_quantity,
                            "sale_amount": sale_amount
                        })
                
                # Update rider stock
                if item.remaining_quantity <= 0:
                    supabase.table("rider_stock").delete().eq("rider_id", opname.rider_id).eq("product_id", item.product_id).execute()
                else:
                    supabase.table("rider_stock").update({"quantity": item.remaining_quantity}).eq("rider_id", opname.rider_id).eq("product_id", item.product_id).execute()
        
        # Create sales transaction from stock opname
        if sales_records:
            trans_id = str(uuid.uuid4())
            supabase.table("transactions").insert({
                "id": trans_id,
                "rider_id": opname.rider_id,
                "total_amount": total_sales,
                "payment_method": "stock_opname",
                "notes": f"Penjualan dari Stock Opname - {opname.notes or 'No notes'}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            
            for record in sales_records:
                product = supabase.table("products").select("price").eq("id", record["product_id"]).execute()
                price = product.data[0]["price"] if product.data else 0
                
                supabase.table("transaction_items").insert({
                    "id": str(uuid.uuid4()),
                    "transaction_id": trans_id,
                    "product_id": record["product_id"],
                    "quantity": record["quantity_sold"],
                    "price": price,
                    "subtotal": record["sale_amount"]
                }).execute()
        
        # Record stock opname history
        supabase.table("stock_opname").insert({
            "id": opname_id,
            "rider_id": opname.rider_id,
            "admin_id": user["id"],
            "total_sales": total_sales,
            "notes": opname.notes,
            "details": json.dumps(sales_records),
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        return {
            "message": "Stock Opname completed successfully",
            "total_sales": total_sales,
            "sales_details": sales_records
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stock opname error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stock-opname")
async def get_stock_opname_history(
    rider_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    try:
        query = supabase.table("stock_opname").select("*, rider:profiles!stock_opname_rider_id_fkey(full_name), admin:profiles!stock_opname_admin_id_fkey(full_name)")
        
        if rider_id:
            query = query.eq("rider_id", rider_id)
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        
        result = query.order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get stock opname error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== GPS TRACKING ROUTES ====================

@api_router.post("/gps/update")
async def update_gps(gps: GPSUpdate, user: dict = Depends(get_current_user)):
    """Update rider GPS location (replaces previous location)"""
    try:
        # Check if location exists
        existing = supabase.table("gps_locations").select("id").eq("rider_id", user["id"]).execute()
        
        location_data = {
            "rider_id": user["id"],
            "latitude": gps.latitude,
            "longitude": gps.longitude,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing.data:
            # Update existing
            supabase.table("gps_locations").update(location_data).eq("rider_id", user["id"]).execute()
        else:
            # Create new
            location_data["id"] = str(uuid.uuid4())
            supabase.table("gps_locations").insert(location_data).execute()
        
        return {"message": "Location updated"}
    except Exception as e:
        logger.error(f"GPS update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gps/locations")
async def get_all_locations(user: dict = Depends(require_admin)):
    """Get all riders' last locations (admin only)"""
    try:
        result = supabase.table("gps_locations").select("*, profiles(full_name, avatar_url)").execute()
        return result.data
    except Exception as e:
        logger.error(f"Get locations error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== USER MANAGEMENT ROUTES ====================

@api_router.get("/users")
async def get_users(user: dict = Depends(require_admin)):
    try:
        result = supabase.table("profiles").select("id, email, full_name, phone, avatar_url, created_at").execute()
        
        users = []
        for u in result.data:
            role_result = supabase.table("user_roles").select("role").eq("user_id", u["id"]).execute()
            u["role"] = role_result.data[0]["role"] if role_result.data else "rider"
            users.append(u)
        
        return users
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/riders")
async def get_riders(user: dict = Depends(require_admin)):
    """Get all riders"""
    try:
        # Get rider role user ids
        roles = supabase.table("user_roles").select("user_id").eq("role", "rider").execute()
        rider_ids = [r["user_id"] for r in roles.data]
        
        if not rider_ids:
            return []
        
        # Get profiles
        result = supabase.table("profiles").select("id, email, full_name, phone, avatar_url").in_("id", rider_ids).execute()
        return result.data
    except Exception as e:
        logger.error(f"Get riders error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, user: dict = Depends(require_super_admin)):
    """Update user role (super admin only)"""
    try:
        if role not in ["rider", "admin", "super_admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        supabase.table("user_roles").update({"role": role}).eq("user_id", user_id).execute()
        return {"message": "Role updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update role error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_super_admin)):
    """Delete user (super admin only)"""
    try:
        supabase.table("user_roles").delete().eq("user_id", user_id).execute()
        supabase.table("profiles").delete().eq("id", user_id).execute()
        return {"message": "User deleted successfully"}
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== REPORTS ROUTES ====================

@api_router.get("/reports/summary")
async def get_report_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    rider_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    try:
        # Build transaction query
        query = supabase.table("transactions").select("*")
        
        if user.get("role") not in ["admin", "super_admin"]:
            query = query.eq("rider_id", user["id"])
        elif rider_id:
            query = query.eq("rider_id", rider_id)
        
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        
        transactions = query.execute()
        
        # Calculate summary
        total_sales = sum(t["total_amount"] for t in transactions.data)
        total_transactions = len(transactions.data)
        
        # Get reject history for loss calculation
        reject_query = supabase.table("reject_history").select("*, products(price)")
        if start_date:
            reject_query = reject_query.gte("created_at", start_date)
        if end_date:
            reject_query = reject_query.lte("created_at", end_date)
        
        rejects = reject_query.execute()
        total_loss = sum(r["quantity"] * (r["products"]["price"] if r.get("products") else 0) for r in rejects.data)
        
        return {
            "total_sales": total_sales,
            "total_transactions": total_transactions,
            "total_loss": total_loss,
            "net_profit": total_sales - total_loss
        }
    except Exception as e:
        logger.error(f"Get summary error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/reports/leaderboard")
async def get_leaderboard(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    try:
        # Get all transactions
        query = supabase.table("transactions").select("rider_id, total_amount")
        
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
        
        transactions = query.execute()
        
        # Aggregate by rider
        rider_sales = {}
        for t in transactions.data:
            rider_id = t["rider_id"]
            if rider_id not in rider_sales:
                rider_sales[rider_id] = {"total_sales": 0, "total_transactions": 0}
            rider_sales[rider_id]["total_sales"] += t["total_amount"]
            rider_sales[rider_id]["total_transactions"] += 1
        
        # Get rider names
        if rider_sales:
            profiles = supabase.table("profiles").select("id, full_name, avatar_url").in_("id", list(rider_sales.keys())).execute()
            profile_map = {p["id"]: p for p in profiles.data}
            
            leaderboard = []
            for rider_id, stats in rider_sales.items():
                profile = profile_map.get(rider_id, {})
                leaderboard.append({
                    "rider_id": rider_id,
                    "full_name": profile.get("full_name", "Unknown"),
                    "avatar_url": profile.get("avatar_url"),
                    "total_sales": stats["total_sales"],
                    "total_transactions": stats["total_transactions"]
                })
            
            # Sort by total sales descending
            leaderboard.sort(key=lambda x: x["total_sales"], reverse=True)
            return leaderboard
        
        return []
    except Exception as e:
        logger.error(f"Get leaderboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ROOT & HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "POS Rider System API v1.0", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
