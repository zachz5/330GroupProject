import Header from './components/Header';
import Footer from './components/Footer';
import Router from './components/Router';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

export default App;

