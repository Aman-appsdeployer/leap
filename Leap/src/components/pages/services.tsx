
import { SparklesCore } from "../ui/sparkles";



const Services = () => {
  return (
    <section className="py-5 sm:py-16 lg:py-1">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-3xl mx-auto text-center">
          
          <div className="h-[10rem] w-full  flex flex-col items-center justify-center overflow-hidden rounded-md">
            <h2 className="text-3xl -mt-16 font-poppins pb-5 font-medium leading-tight tracking-wide text-red-600 hover:text-red-600 sm:text-3xl lg:text-5xl">
            Services
            </h2>
            <div className="w-[40rem] h-10 relative">
              {/* Gradients */}
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-[2px] w-3/4 blur-sm" />
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-px w-3/4" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-[5px] w-1/4 blur-sm" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-px w-1/4" />

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
              <div className="absolute inset-0 w-full h-full  [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
            </div>
          </div>
          {/* <p className=" max-w-full -mt-16  font-poppins text-lg leading-relaxed text-secondary text-white">
            Invest ethically with IRIS
          </p> */}
        </div>
      </div>
    </section>
  );
};
export default Services;


