import Chart from "./components/basic/Chart.jsx";
//import Chart from "./components/basic/ChartExperiment.jsx";
import { CandlesProvider } from "./Context/CandlesContext.jsx";

function App() {

  return (
    <CandlesProvider>
      <main>
        <Chart />
      </main>
    </CandlesProvider>
  )
}

export default App;
