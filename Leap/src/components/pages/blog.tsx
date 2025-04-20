
export const projects = [   
];
const Blog = () => {
    return (
        <section className="py-10 sm:py-16 lg:py-20">
            <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
                <div className="h-[10rem] w-full -mt-16 flex flex-col items-center justify-center overflow-hidden rounded-md">
                    <h2 className="text-3xl -mt-16 font-poppins pb-5 font-medium leading-tight tracking-wide text-red-600 hover:text-red-600 sm:text-3xl lg:text-5xl">
                        BLOG
                    </h2>
                    <div className="w-[40rem] h-10 relative">
                        {/* Gradients */}
                        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-[2px] w-3/4 blur-sm" />
                        <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-px w-3/4" />
                        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-[5px] w-1/4 blur-sm" />
                        <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-red-600 to-transparent h-px w-1/4" />     
                        <div className="absolute inset-0 w-full h-full  [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto text-center">

                    <p className="max-w-2xl mx-auto font-poppins  text-base leading-relaxed text-white -mt-14">
                        
                    </p>
                </div>
            </div>
        </section>
    );
};
export default Blog;







