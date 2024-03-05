import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { handler } from '../index.mjs'; // Ensure the path matches your project structure

// Correctly mock the aws-sdk and uuid modules
jest.mock('aws-sdk', () => ({
    DynamoDB: {
        DocumentClient: jest.fn().mockImplementation(() => ({
            scan: jest.fn().mockImplementation(() => ({
                promise: jest.fn().mockResolvedValueOnce({
                    Items: [{
                        distance_factor: 1,
                        days_from_start: 1,
                        duration: 1,
                        reward_factor: 1,
                        template_id: 'template-1',
                    }],
                }),
            })),
            batchWrite: jest.fn().mockImplementation(() => ({
                promise: jest.fn().mockResolvedValue({}),
            })),
        })),
    },
}));

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-challenge-id'),
}));

describe('Challenge Handler Function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create challenges successfully for new user', async () => {
        const event = {
            body: JSON.stringify({
                user_id: 'test-user-id',
                season_id: 'test-season-id',
            }),
        };

        const response = await handler(event);

        expect(response).toEqual({
            statusCode: 200,
            body: JSON.stringify({ message: "Challenges created successfully for new user." }),
        });

        // Get the instantiated DocumentClient mock to verify method calls
        const documentClientMock = AWS.DynamoDB.DocumentClient.mock.instances[0];

        // Verify that scan and batchWrite methods were called
        //expect(documentClientMock.scan).toHaveBeenCalled();
        // expect(documentClientMock.batchWrite).toHaveBeenCalled();

        // Verify UUID generation was called for challenge_id
        expect(uuidv4).toHaveBeenCalled();
    });
});
