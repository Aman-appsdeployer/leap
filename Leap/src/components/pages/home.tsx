
// import Hero from "../ui/hero";
import CounterStats from "../CounterStats";
import PostViewer from "../PostViewer";
import Login from "./login";
const Home = () => {
  return (
    <div className="overflow-x-hidden font-poppins">
      
     
      <Login/>
      <PostViewer/>
      <CounterStats />
      
    </div>
  );
};

export default Home;



