source ./.env; 

# Retrieve credentials from file
CONVERSATION_USERNAME="1c2eb292-e8f5-4bcf-990f-4342814f0ced";
CONVERSATION_PASSWORD="K4oTlz1fmkVm";
DISCOVERY_USERNAME="50628cdb-2d16-4b34-b972-4e5867027425";
DISCOVERY_PASSWORD="n5GZGlrxLzXn";

# Create OpenWhisk Actions
echo 'Creating OpenWhisk Actions...'
export PACKAGE="assistant-with-discovery-openwhisk"
bx wsk package create assistant-with-discovery-openwhisk
bx wsk action create $PACKAGE/conversation actions/conversation.js --web true
bx wsk  action create $PACKAGE/discovery actions/discovery.js --web true

echo 'Setting default parameters...'
bx wsk  action update $PACKAGE/conversation --param username $CONVERSATION_USERNAME --param password $CONVERSATION_PASSWORD --param workspace_id $WORKSPACE_ID
bx wsk action update $PACKAGE/discovery --param username $DISCOVERY_USERNAME --param password $DISCOVERY_PASSWORD --param environment_id $ENVIRONMENT_ID --param collection_id $COLLECTION_ID

echo 'Creating OpenWhisk Sequence...'
bx wsk  action create $PACKAGE/assistant-with-discovery-sequence --sequence $PACKAGE/conversation,$PACKAGE/discovery --web true

echo 'Retrieving OpenWhisk WebAction URL...'
API_URL=`bx wsk action get $PACKAGE/assistant-with-discovery-sequence --url | sed -n '2p'`;
API_URL+=".json"

# Write API Url to .env file
head -n 4 .env | cat >> .env_tmp; mv .env_tmp .env
echo "REACT_APP_API_URL=$API_URL" >> .env
