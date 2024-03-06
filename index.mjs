import { v4 as uuidv4 } from 'uuid';
import { getAllTemplates,  createChallengeEntriesForUser} from './utils.mjs';

export async function handler(event) {
    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        console.error("Failed to parse event body as JSON:", e);
        return { statusCode: 400, body: JSON.stringify({ error: "Bad request. Body is not valid JSON." }) };
    }
    if (!data.user_id || !data.season_id) {
        console.error("Missing required fields in the data.");
        return { statusCode: 400, body: JSON.stringify({ error: "Bad request. Missing required fields." }) };
    }
    
    // Assume event contains user_id, season_id directly for simplicity
    let { user_id, season_id } = data;

    try {
        const templates = await getAllTemplates("challenges_template");

        let challengeDataArray = [];

        // Let's assume the average to be 2.5 km per day for new users
        let average_skill = 2.5; 

        for (const template_data of templates) {
            // Convert from km to meters using the placeholder average_skill value
            let target_meters = average_skill * template_data.distance_factor * 1000;
            target_meters = Math.round(target_meters / 10) * 10;
            let points = Math.round(target_meters * template_data.reward_factor *10) / 1000;

            let challenge_start_date = new Date();
            challenge_start_date.setDate(challenge_start_date.getDate() + template_data.days_from_start);

            let challenge_end_date = new Date(challenge_start_date);    
            let scaleFactor;

            // If duration is -1, set the end date to the last day of the current month
            if (template_data.duration === -1) {
                // Get the last day of the month
                challenge_end_date = new Date(challenge_start_date.getFullYear(), challenge_start_date.getMonth() + 1, 0);
                // Calculate the scale factor based on the number of days left in the month
                const total_days_in_the_month = challenge_end_date.getDate();
                const todays_day = challenge_start_date.getDate();
                scaleFactor = (total_days_in_the_month - todays_day) / total_days_in_the_month;
            } else {
                // Add duration days to the start date
                challenge_end_date.setDate(challenge_end_date.getDate() + template_data.duration - 1);
                // If duration is not -1, scale factor is considered as 1 (no scaling)
                scaleFactor = 1;
            }

            // Apply scaling to target_meters if duration is -1 to account for the remaining days in the month
            //console.log("Scale factor:", scaleFactor);
            if(template_data.duration === -1) {
                target_meters = target_meters * scaleFactor;
                points = points * scaleFactor;
                // Ensure target_meters is rounded off as needed
                target_meters = Math.round(target_meters / 10) * 10;
                points = Math.round(points * 10) / 10;
            }

            if (challenge_end_date.getMonth() !== challenge_start_date.getMonth()) {
                console.log("Challenge end date falls into the next month. Skipping this challenge.");
                continue;
            }
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
                bucket_id: -1,
            });
        }

        await createChallengeEntriesForUser(user_id, challengeDataArray, "challenges");

        return { statusCode: 200, body: JSON.stringify({ message: "Challenges created successfully for new user." }) };
    } catch (error) {
        console.error("Error processing data for new user:", error);
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to process data for new user due to an internal error." }) };
    }
}
