import { handler } from '../index.mjs';
import * as utils from '../utils.mjs'; 

// Mocking utility functions directly
jest.mock('../utils.mjs', () => ({
  getAllTemplates: jest.fn(),
  createChallengeEntries: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-challenge-id'),
}));

describe('Challenge Handler Function', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Provide default mock implementations
    utils.getAllTemplates.mockResolvedValue([{
      distance_factor: 1,
      days_from_start: 1,
      duration: 1,
      reward_factor: 1,
      template_id: 'template-1',
    }]);
    utils.createChallengeEntries.mockResolvedValue();
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

    // Verify the utility functions were called as expected
    expect(utils.getAllTemplates).toHaveBeenCalledWith("challenges_template");
    expect(utils.createChallengeEntries).toHaveBeenCalledWith('test-user-id', expect.any(Array), "challenges");
  });

  it('should return an error for invalid JSON in event body', async () => {
    const event = { body: "This is not valid JSON" };
  
    const response = await handler(event);
  
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Bad request. Body is not valid JSON.");
  });

  it('should return an error for missing required fields in the data', async () => {
    const event = { body: JSON.stringify({}) };
  
    const response = await handler(event);
  
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).error).toBe("Bad request. Missing required fields.");
  });

});
