import aws from 'aws-sdk';
const documentClient = new aws.DynamoDB.DocumentClient();

export async function getAllTemplates(tableName) {
    let templates = [];
    let params = { TableName: tableName };
    let items;

    do {
        items = await documentClient.scan(params).promise();
        templates.push(...items.Items);
        params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (items.LastEvaluatedKey);

    return templates;
}

export async function createChallengeEntriesForUser(userId, challengeDataArray, tableName) {
    let requestItems = challengeDataArray.map(challengeData => ({
        PutRequest: { Item: challengeData }
    }));

    // Use batchWrite to insert the challenges into the table
    while (requestItems.length > 0) {
        const batch = requestItems.splice(0, 25);
        const params = { RequestItems: { [tableName]: batch } };
        await documentClient.batchWrite(params).promise();
    }
}