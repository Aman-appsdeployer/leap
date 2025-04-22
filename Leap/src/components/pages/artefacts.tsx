import { SparklesCore } from "../ui/sparkles";

const Artefacts  = () => {
  return (
    <section className="py-10 sm:py-16">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl font-poppins">
        <div className="h-[10rem] -mt-24 w-full flex flex-col items-center justify-center overflow-hidden rounded-md">
          <h2 className="text-3xl pb-5 font-poppins font-medium leading-tight tracking-wide text-red-600  hover:text-red-600  sm:text-4xl lg:text-5xl">
            Artefacts
          </h2>
          <div className="w-[40rem] h-10 relative">
            {/* Gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-red-600  to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-red-600  to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-red-600  to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-red-600  to-transparent h-px w-1/4" />

            {/* Core component */}
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="w-full h-full"
              particleColor="#030F26"
            />
            {/* Radial Gradient to prevent sharp edges */}
            <div className="absolute inset-0 w-full h-full [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
          </div>
        </div>
        <div className="text-base leading-relaxed -mt-6">
          <p className="mb-6 text-gray-300">
            I am 'Sajid Hussain Ansari’, teacher of Khanna High School. I have completed the ITE Certificate Course in 2017 and  also worked as ITE master <br/> trainer in the ITE field. I am going to share the success story of one of my students – Priyanshu Mishra. <br/>
            My first meeting with Priyanshu was very normal. He belonged to a middle class family and was quite excited to learn new things using technology. <br/>After completing his project for ITE, he learnt how to create presentations using multimedia. <br/>
            For the ITE Mela we created coding projects using Scratch and a prototype of a burglar alarm using Arduino.<br/> 
            He also got a chance to use Python and familiarize himself with it. <br/>
            In fact an idea of his which he created using Python was selected by ‘AI For Youth’ – a Central Government Initiative.<br/>
             He participated in various webinars and web quests which visibly improved his confidence and communication skills. <br/>
             He now says he wants to become a Gaming Engineer when he grows up.<br/> 
             Without a doubt, I can say the ITE initiative has made an impact on Priyanshu.
          </p>
          <p className="mb-6 text-gray-300">

          </p>
        </div>



      </div>
    </section>
  );
};

export default Artefacts ;

