// Simple test script to verify AI responses are working
// Run this with: node test-ai-responses.js

const testQuestions = [
  "What is the meaning of TIN?",
  "Can you explain liability clauses?",
  "What happens if I don't pay on time?",
  "Tell me about arbitration in contracts",
  "What are the key risks in this document?"
];

async function testAIResponses() {
  console.log('🧪 Testing AI Responses...\n');
  
  for (const question of testQuestions) {
    console.log(`❓ Question: ${question}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question,
          context: null,
          filename: 'test-document.pdf',
          conversationHistory: []
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response: ${data.answer.substring(0, 100)}...`);
      } else {
        console.log(`❌ Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testAIResponses().catch(console.error);
}

module.exports = { testAIResponses };
