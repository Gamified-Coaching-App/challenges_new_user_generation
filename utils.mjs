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

export async function createChallengeEntries(challengeDataArray, tableName) {
    for (const challengeData of challengeDataArray) {
        const params = {
            TableName: tableName,
            Item: challengeData
        };
        try {
            await documentClient.put(params).promise();
        } catch (error) {
            console.error("Failed to create challenge entry:", error);
            // Optionally, handle the error (e.g., retry logic, logging, etc.)
        }
    }
}