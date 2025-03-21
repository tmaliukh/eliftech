import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import QuestionnaireCatalog from './pages/QuestionnaireCatalog';
import QuestionnaireBuilder from './pages/QuestionnaireBuilder';
import InteractiveQuestionnaire from './pages/InteractiveQuestionnaire';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<QuestionnaireCatalog />} />
          <Route path="/create" element={<QuestionnaireBuilder />} />
          <Route path="/edit/:id" element={<QuestionnaireBuilder />} />
          <Route path="/run/:id" element={<InteractiveQuestionnaire />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
