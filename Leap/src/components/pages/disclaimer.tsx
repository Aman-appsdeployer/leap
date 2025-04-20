import { SparklesCore } from "../ui/sparkles";

const Disclaimer = () => {
  return (
    <section className="py-10 sm:py-16">
      <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl text-white font-poppins">
        <div className="h-[10rem] w-full flex -mt-24 flex-col items-center justify-center overflow-hidden rounded-md">
          <h2 className="text-3xl pb-5 font-poppins font-semibold leading-6 tracking-wide text-red-600 hover:text-red-600 sm:text-4xl lg:text-5xl">
            Disclaimer
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
        <div>
          <p className="text-sm sm:text-base  -mt-8 md:text-lg">
            • TISS does not take responsibility of the Project content quality uploaded by student <br/> <br/> 
 
            • Personally identifiable information and account activity are also protected through the use of usernames and passwords. In order to help maintain the security of your information, you should protect the confidentiality of your user name and password <br/><br/>

            • Personally identifiable information and account activity are also protected through the use of usernames and passwords. In order to help maintain the security of your information, you should protect the confidentiality of your user name and password <br/><br/>

            • We do not ask you any information which may be sensitive <br/><br/>

            • Do not enter any sensitive information like Credit card details pin number etc <br/><br/>

            • We do not use your information for any kind of commercial activity. We only store some of your personal information like Name, contact info, School, Age, Class <br/><br/>

            • Your uploaded artefacts may be used for research purpose while your name will be kept anonymous <br/><br/>

            • Any complain and suggestion or feedback should be sent to the following email address. support@leap21stcentury.org <br/><br/>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Disclaimer;