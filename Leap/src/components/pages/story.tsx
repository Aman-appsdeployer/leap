import { SparklesCore } from "../ui/sparkles";

const Story = () => {
  return (
    <section className="py-10 sm:py-16">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl font-poppins">
        <div className="h-[10rem] -mt-24 w-full flex flex-col items-center justify-center overflow-hidden rounded-md">
          <h2 className="text-3xl pb-5 font-poppins font-medium leading-tight tracking-wide text-red-600  hover:text-red-600  sm:text-4xl lg:text-5xl">
            Stories from the field
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

          </p>
        </div>



      </div>
    </section>
  );
};

export default Story;

