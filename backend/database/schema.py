from sqlalchemy.orm import relationship
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date
from database.conn import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    msisdn = Column(String, unique=True, index=True)
    
    subscriptions = relationship("Subscription", back_populates="user")

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, index = True)
    service_duration = Column(String, index = True)
    date_subscribed = Column(Date, index = True)
    description = Column(String, index = True)
    end_date = Column(Date, index = True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Foreign key in a real case
    
    user = relationship("User", back_populates="subscriptions")