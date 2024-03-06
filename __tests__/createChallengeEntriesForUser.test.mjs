import AWS from 'aws-sdk';
import { createChallengeEntriesForUser } from '../utils.mjs';

// Mock AWS SDK's DynamoDB DocumentClient
jest.mock('aws-sdk', () => {
  // Mock the batchWrite method
  const batchWriteMock = jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({ UnprocessedItems: {} }),
  }));
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        batchWrite: batchWriteMock,
      })),
    },
  };
});

describe('createChallengeEntriesForUser', () => {
    const documentClient = new AWS.DynamoDB.DocumentClient();
    const tableName = 'TestTable';
    const userId = 'test-user-id';

    beforeEach(() => {
      // Clear mock implementations and calls before each test
      documentClient.batchWrite.mockClear();
    });

    it('correctly batches and writes challenge entries to DynamoDB for a user', async () => {
      const challengeDataArray = Array.from({ length: 50 }, (_, index) => ({
        userId: userId,
        challengeId: `challenge${index}`,
        data: `data${index}`
      }));

      await createChallengeEntriesForUser(userId, challengeDataArray, tableName);

      // For 50 items, batchWrite should be called twice because DynamoDB batchWrite can process a maximum of 25 items at a time
      expect(documentClient.batchWrite).toHaveBeenCalledTimes(2);

      // Optionally, check the content of the first and second call
      // First call with the first 25 items
      expect(documentClient.batchWrite.mock.calls[0][0].RequestItems[tableName]).toHaveLength(25);
      // Second call with the next 25 items
      expect(documentClient.batchWrite.mock.calls[1][0].RequestItems[tableName]).toHaveLength(25);
    });
});
