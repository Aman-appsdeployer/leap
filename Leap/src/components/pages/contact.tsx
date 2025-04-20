// import { useState } from "react";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";

// const ContactPage = () => {
//     const [email, setEmail] = useState("");
//     const [number, setNumber] = useState("");
//     const [name, setName] = useState("");

//     const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault();

//         console.log(email, name, number);

//         setEmail("");
//         setName("");
//         setNumber("");
//     };

//     return (
//         <section className="py-10 sm:py-16 lg:py-20">
//             <div className="px-4 mx-auto sm:px-6 lg:px-8 max-w-7xl">
//                 <div className="max-w-3xl mx-auto text-center">
//                     <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#dbc7a6] via-[#3d4957] to-[#282e3a]">
//                         Connect with us
//                     </h2>
//                     <p className="max-w-2xl mx-auto mt-4 text-base leading-relaxed text-secondary">
//                         Please visit our Learn section for our{" "}
//                         <a
//                             href="faqs"
//                             className="text-primary underline-offset-4 underline"
//                         >
//                             frequently asked questions
//                         </a>{" "}
//                         on more about Nuqi and investing through our mobile app.
//                         You can share questions about your Nuqi account through
//                         our mobile app.
//                     </p>
//                 </div>
//                 <form
//                     onSubmit={onSubmit}
//                     className="grid md:grid-cols-3 gap-6 md:gap-8 place-items-center mt-10"
//                 >
//                     <div className="grid w-full items-center gap-3">
//                         <Label htmlFor="text">Name</Label>
//                         <Input
//                             type="text"
//                             id="text"
//                             placeholder="Your name"
//                             onChange={(e) => setName(e.target.value)}
//                             value={name}
//                         />
//                     </div>
//                     <div className="grid w-full items-center gap-3">
//                         <Label htmlFor="email">Email</Label>
//                         <Input
//                             type="email"
//                             id="email"
//                             placeholder="Your email"
//                             onChange={(e) => setEmail(e.target.value)}
//                             value={email}
//                             required
//                         />
//                     </div>
//                     <div className="grid w-full items-center gap-3">
//                         <Label htmlFor="tel">Phone number</Label>
//                         <div className="flex border border-gray-300 rounded-md">
//                             <span className="flex items-center border-r px-3">
//                                 +971
//                             </span>
//                             <Input
//                                 type="tel"
//                                 id="tel"
//                                 placeholder="Your phone number"
//                                 className="border-none"
//                                 onChange={(e) => setNumber(e.target.value)}
//                                 value={number}
//                             />
//                         </div>
//                     </div>

//                     <button className="md:col-start-2 inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#3d4957,45%,#282e3a,55%,#3d4957)] bg-[length:200%_100%] px-6 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
//                         Submit
//                     </button>
//                 </form>
//             </div>
//         </section>
//     );
// };

// export default ContactPage;
