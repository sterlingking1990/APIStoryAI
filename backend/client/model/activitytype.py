from enum import Enum
class ActivityType(str, Enum):
    query = "Query"
    question = "Question"
    visualization = "Visualization"