import aws from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const documentClient = new aws.DynamoDB.DocumentClient();

async function getAllTemplates(tableName) {
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

async function createChallengeEntriesForUser(userId, challengeDataArray, tableName) {
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

export async function handler(event) {
    // Assume event contains user_id, season_id, and start_date directly for simplicity
    let { user_id, season_id, start_date } = event;

    if (!user_id || !season_id || !start_date) {
        console.error("Missing required information from event.");
        return { statusCode: 400, body: JSON.stringify({ error: "Bad request. Missing user_id, season_id, or start_date." }) };
    }

    try {
        const templates = await getAllTemplates("challenges_template");
        let challengeDataArray = [];

        // For simplicity, let's assume the user's average_skill needs to be fetched or is provided. Here we'll set a static value
        let average_skill = 2.5; // Placeholder value

        for (const template_data of templates) {
            // Convert from km to meters using the placeholder average_skill value
            let target_meters = average_skill * template_data.distance_factor * 1000;
            target_meters = Math.round(target_meters / 10) * 10;
            const points = Math.round(target_meters * template_data.reward_factor) / 1000;

            let challenge_start_date = new Date(start_date);
            challenge_start_date.setDate(challenge_start_date.getDate() + template_data.days_from_start);

            let challenge_end_date = new Date(challenge_start_date);
            challenge_end_date.setDate(challenge_end_date.getDate() + template_data.duration - 1);

            const formatted_start_date = challenge_start_date.toISOString().split('T')[0] + 'T00:00:00';
            const formatted_end_date = challenge_end_date.toISOString().split('T')[0] + 'T23:59:59';

            challengeDataArray.push({
                user_id: user_id,
                challenge_id: uuidv4(),
                completed_meters: 0,
                start_date: formatted_start_date,
                end_date: formatted_end_date,
                status: "current",
                target_meters: target_meters,
                template_id: template_data.template_id,
                points: points,
                season_id: season_id,
            });
        }

        await createChallengeEntriesForUser(user_id, challengeDataArray, "challenges");

        return { statusCode: 200, body: JSON.stringify({ message: "Challenges created successfully for new user." }) };
    } catch (error) {
        console.error("Error processing data for new user:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to process data for new user due to an internal error." }) };
    }
}