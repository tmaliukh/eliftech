


Base level









// Questionnaires
POST /api/questionnaires - Create a new questionnaire
GET /api/questionnaires - List questionnaires with pagination
GET /api/questionnaires/:id - Get a single questionnaire
PUT /api/questionnaires/:id - Update a questionnaire
DELETE /api/questionnaires/:id - Delete a questionnaire and its responses

// Responses
POST /api/responses - Submit a response
GET /api/responses/questionnaire/:questionnaireId - Get responses for a questionnaire
GET /api/responses/stats/:questionnaireId - Get statistics for a questionnaire