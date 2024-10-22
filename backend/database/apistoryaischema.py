from sqlalchemy.orm import relationship
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Enum, DateTime, Numeric, BigInteger
from sqlalchemy.sql import func
from database.conn import Base

class APIStoryUser(Base):
    __tablename__ = "apistory_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_auth_id = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # One-to-one relationship with subscription
    subscription = relationship("APIStorySubscription", back_populates="user", uselist=False)
    
    # One-to-many relationship with user activities
    activities = relationship("APIStoryUserActivity", back_populates="user")
    
class APIStorySubscription(Base):
    __tablename__ = "apistory_subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    subscription_type = Column(String, default="Starter", nullable=False)
    subscription_amount = Column(Numeric(10, 2), nullable=True)
    transaction_reference = Column(String, nullable=True) 
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=True)
    user_id = Column(Integer, ForeignKey("apistory_users.id"), nullable=False)
    
    user = relationship("APIStoryUser", back_populates="subscription")
    
class APIStoryUserActivity(Base):
    __tablename__ = "apistory_user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(Enum("Query", "Question", "Visualization", name="activity_types"), nullable=False)
    activity_count = Column(Integer, default=0)  # Number of queries/questions/visualizations
    details = Column(String, nullable=True)  # To store additional details, e.g., question count, visualization type
    activity_date = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("apistory_users.id"), nullable=False)
    
    user = relationship("APIStoryUser", back_populates="activities")

