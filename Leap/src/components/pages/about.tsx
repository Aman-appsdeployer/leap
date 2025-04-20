import { LinkedinIcon } from "lucide-react";
import { Link } from "react-router-dom";
import "../../index.css";
import { SparklesCore } from "../ui/sparkles";


const AboutPage = () => {
  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="px-4 mx-auto sm:px-6 -mt-8 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="h-[10rem] w-full flex -mt-24 flex-col items-center justify-center overflow-hidden rounded-md">
          <h2 className="text-3xl pb-5 font-poppins font-semibold leading-6 tracking-wide text-red-600 hover:text-red-600 sm:text-4xl lg:text-5xl">
            About <span className="text-white">Us</span>
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
        

        {/* Description Section */}
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-white font-poppins max-w-2xl mx-auto -mt-6 text-base sm:text-base lg:text-base leading-relaxed">
           
          </p>
        </div>

        {/* Team Section Header */}
        <h2 className="text-white font-poppins text-3xl text-center mt-8 font-bold leading-tight">
          Meet Our Team
        </h2>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-16">
          {teamData.map((member, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row gap-4 items-center p-6 bg-gradient-to-b from-[#1d1d1f] to-[#0d0d0d] hover:bg-black hover:bg-none hover:shadow-[inset_0_0_20px_#0dd3ff] transition-all duration-300 ease-in-out group"
            >
              {/* Image Section */}
              <div className="flex-shrink-0 w-full md:w-[40%] lg:w-[35%] group-hover:scale-105 transition-transform duration-500">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
              {/* Details Section */}
              <div className="flex flex-col w-full">
                <div className="flex items-center gap-2 mb-2">
                  <h6 className="text-red-600 font-medium text-xl group-hover:text-white transition-colors duration-300">
                    {member.name}
                  </h6>
                  <Link to={member.linkedin} target="_blank">
                    <LinkedinIcon className="text-white group-hover:text-red-600 transition-colors duration-300" />
                  </Link>
                </div>
                <p className="text-white text-xl font-poppins font-medium mb-2">
                  {member.role}
                </p>
                <p className="text-white text-base font-poppins font-light leading-relaxed">
                  {member.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const teamData = [
  {
    name: "ABCD",
    role: "Founder & CEO",
    image: "#",
    linkedin: "#",
    description:
      ".",
  },
  {
    name: "ABCDEF",
    role: "Co-Founder & CXO",
    image: "#",
    linkedin: "#",
    description:
      ".",
  },

  {
    name: "ABCDEFG",
    role: "Head of Marketing",
    image: "/#",
    linkedin: "#",
    description:
      "",
  },

  {
    name: "ACBDE",
    role: "Head of Technology",
    image: "",
    linkedin: "#",
    description:
      ".",
  },

  {
    name: "ACBDES",
    role: "URTYU",
    image: "#",
    linkedin: "#",
    description:
      "",
  },

  {
    name: "MNBVCXZ",
    role: "",
    image: "",
    linkedin: "#",
    description:
      "",
  },
];

export default AboutPage;
