import { getAllTemplates } from '../utils.mjs'; // Adjust the import path as necessary

jest.mock('aws-sdk', () => {
  return {
    DynamoDB: {
      DocumentClient: jest.fn(() => ({
        scan: jest.fn().mockImplementation(() => ({
          promise: jest.fn().mockResolvedValue({
            Items: [{ templateId: '1', name: 'Template One' }],
            LastEvaluatedKey: undefined,
          }),
        })),
      })),
    },
  };
});

describe('getAllTemplates function', () => {
  it('retrieves all templates from a single scan operation', async () => {
    const templates = await getAllTemplates('TemplateTable');
    expect(templates).toEqual([{ templateId: '1', name: 'Template One' }]);
  });
});
