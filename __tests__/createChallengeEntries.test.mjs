import AWS from 'aws-sdk';
import { createChallengeEntries } from '../utils.mjs';

// Mock AWS SDK's DynamoDB DocumentClient
jest.mock('aws-sdk', () => {
  // Mock the put method
  const putMock = jest.fn().mockImplementation(() => ({
    promise: jest.fn().mockResolvedValue({}),
  }));
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        put: putMock,
      })),
    },
  };
});

describe('createChallengeEntries', () => {
  const documentClient = new AWS.DynamoDB.DocumentClient();
  const tableName = 'ChallengesTable';

  beforeEach(() => {
    // Clear mock implementations and calls before each test
    documentClient.put.mockClear();
  });

  it('correctly creates challenge entries in DynamoDB', async () => {
    const challengeDataArray = [
      { challengeId: 'challenge1', data: 'data1' },
      { challengeId: 'challenge2', data: 'data2' }
    ];

    await createChallengeEntries(challengeDataArray, tableName);

    // Expect the put method to be called once for each challenge entry
    expect(documentClient.put).toHaveBeenCalledTimes(challengeDataArray.length);

    // Optionally, verify the first call to put includes the correct TableName and an Item matching the first challenge entry
    expect(documentClient.put.mock.calls[0][0]).toEqual({
      TableName: tableName,
      Item: challengeDataArray[0]
    });

    // Similarly, verify the second call (if necessary, based on the number of items)
    expect(documentClient.put.mock.calls[1][0]).toEqual({
      TableName: tableName,
      Item: challengeDataArray[1]
    });
  });
});
