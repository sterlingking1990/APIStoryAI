def parse_api_collection(api_data):
    
    summary = "This API Collection contains resources for users and their subscriptions"
    
    questions = [
        "I want to get all the users",
        "I want all subscriptions for a particular user",
        "I want all the subscriptions that happened this week",
        "What are the services with the highest number of subscriptions?"
    ]
    
    return summary,questions