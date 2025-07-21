import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const UploadProject = () => {
  const currentDate = new Date();
  const month = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear().toString();
  const navigate = useNavigate();

  const student = JSON.parse(localStorage.getItem("student") || "{}");

  const [topics, setTopics] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    topic_id_fk: "",
    other_topic: "",
    project_title: "",
    project_details: "",
    subject_id_fk: "",
    project_language: "",
    file_type_id_fk: "",
  });

  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [projectThumbnail, setProjectThumbnail] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    axios.get("http://209.182.233.188:8000/api/projects/topics").then((res) => setTopics(res.data));
    axios.get("http://209.182.233.188:8000/api/projects/languages").then((res) => setLanguages(res.data));
    axios.get("http://209.182.233.188:8000/api/projects/file-types").then((res) => setFileTypes(res.data));
    axios.get("http://209.182.233.188:8000/api/projects/subjects").then((res) => setSubjects(res.data));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmed) {
      alert("⚠️ Please confirm before uploading by checking the box.");
      return;
    }

    if (!projectFile) {
      alert("Please upload a project file.");
      return;
    }

    const confirmUpload = window.confirm("Are you sure you want to upload this project?");
    if (!confirmUpload) return;

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (["subject_id_fk", "topic_id_fk", "file_type_id_fk"].includes(key)) {
        data.append(key, String(parseInt(value)));
      } else {
        data.append(key, value);
      }
    });

    data.append("project_month", month);
    data.append("project_year", year);
    data.append("student_id_fk", student.student_details_id_pk);
    data.append("school_id_fk", student.school_id_fk);
    data.append("class_id_fk", student.class_id_fk);
    data.append("section_id_fk", student.section_id_fk);
    data.append("uploaded_by_user_id", student.student_details_id_pk);
    data.append("uploaded_by_user_type", "1");
    data.append("project_file", projectFile);
    if (projectThumbnail) {
      data.append("project_thumbnail", projectThumbnail);
    }

    try {
      const res = await axios.post("http://209.182.233.188:8000/api/projects/upload-project", data);
      setSuccessMessage(" " + res.data.message);

      // ⏳ Wait 5 seconds, then go back
      setTimeout(() => navigate(-1), 5000);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to upload project.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-indigo-100 py-10">
      <div className="w-full max-w-2xl mx-auto bg-white p-6 sm:p-8 shadow-xl rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700">Upload Your Project</h2>

        {successMessage && (
          <div className="bg-green-100 text-green-800 p-3 rounded mb-4 text-center">
            {successMessage} <br />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="project_title" placeholder="Project Title" required onChange={handleChange} className="w-full border rounded-lg p-2" />
          <textarea name="project_details" placeholder="Project Details" required onChange={handleChange} className="w-full border rounded-lg p-2" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select name="topic_id_fk" required onChange={handleChange} className="w-full border rounded-lg p-2">
              <option value="">Select Topic</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <input name="other_topic" placeholder="Other Topic (optional)" onChange={handleChange} className="w-full border rounded-lg p-2" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select name="project_language" required onChange={handleChange} className="w-full border rounded-lg p-2">
              <option value="">Select Language</option>
              {languages.map((l) => (
                <option key={l.id} value={l.label}>{l.label}</option>
              ))}
            </select>
            <select name="file_type_id_fk" required onChange={handleChange} className="w-full border rounded-lg p-2">
              <option value="">Select File Type</option>
              {fileTypes.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          <select name="subject_id_fk" required onChange={handleChange} className="w-full border rounded-lg p-2">
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <div>
            <label className="block mb-1 font-medium">Project File (required)</label>
            <input type="file" required onChange={(e) => setProjectFile(e.target.files?.[0] || null)} className="w-full" />
          </div>

          <div>
            <label className="block mb-1 font-medium">Project Thumbnail (optional)</label>
            <input type="file" onChange={(e) => setProjectThumbnail(e.target.files?.[0] || null)} className="w-full" />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="confirm" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mr-2" />
            <label htmlFor="confirm" className="text-sm text-gray-700">I confirm that the information provided is correct.</label>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition">
            Upload Project
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadProject;






// import axios from "axios";
// import React, { useEffect, useState } from "react";

// const UploadProject = () => {
//   const currentDate = new Date();
//   const month = currentDate.toLocaleString("default", { month: "long" });
//   const year = currentDate.getFullYear().toString();

//   const student = JSON.parse(localStorage.getItem("student") || "{}");

//   const [topics, setTopics] = useState([]);
//   const [languages, setLanguages] = useState([]);
//   const [fileTypes, setFileTypes] = useState([]);
//   const [subjects, setSubjects] = useState([]);

//   const [formData, setFormData] = useState({
//     topic_id_fk: "",
//     other_topic: "",
//     project_title: "",
//     project_details: "",
//     subject_id_fk: "",
//     project_language: "",
//     file_type_id_fk: "",
//   });

//   const [projectFile, setProjectFile] = useState<File | null>(null);
//   const [projectThumbnail, setProjectThumbnail] = useState<File | null>(null);
//   const [confirmed, setConfirmed] = useState(false);

//   useEffect(() => {
//     axios.get("http://209.182.233.188:8000/api/projects/topics").then((res) => setTopics(res.data));
//     axios.get("http://209.182.233.188:8000/api/projects/languages").then((res) => setLanguages(res.data));
//     axios.get("http://209.182.233.188:8000/api/projects/file-types").then((res) => setFileTypes(res.data));
//     axios.get("http://209.182.233.188:8000/api/projects/subjects").then((res) => setSubjects(res.data));
//   }, []);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!confirmed) {
//       alert("⚠️ Please confirm before uploading by checking the box.");
//       return;
//     }

//     if (!projectFile) {
//       alert("Please upload a project file.");
//       return;
//     }

//     const confirmUpload = window.confirm("Are you sure you want to upload this project?");
//     if (!confirmUpload) return;

//     const data = new FormData();

//     // Ensure integer fields are parsed correctly
//     Object.entries(formData).forEach(([key, value]) => {
//       if (["subject_id_fk", "topic_id_fk", "file_type_id_fk"].includes(key)) {
//         data.append(key, String(parseInt(value)));
//       } else {
//         data.append(key, value);
//       }
//     });

//     data.append("project_month", month);
//     data.append("project_year", year);
//     data.append("student_id_fk", student.student_details_id_pk);
//     data.append("school_id_fk", student.school_id_fk);
//     data.append("class_id_fk", student.class_id_fk);
//     data.append("section_id_fk", student.section_id_fk);
//     data.append("uploaded_by_user_id", student.student_details_id_pk);
//     data.append("uploaded_by_user_type", "1");
//     data.append("project_file", projectFile);
//     if (projectThumbnail) {
//       data.append("project_thumbnail", projectThumbnail);
//     }

//     // Debug log
//     for (let pair of data.entries()) {
//       console.log(pair[0], pair[1]);
//     }

//     try {
//       const res = await axios.post("http://209.182.233.188:8000/api/projects/upload-project", data);
//       alert("✅ " + res.data.message);
//     } catch (err) {
//       console.error(err);
//       alert("❌ Failed to upload project.");
//     }
//   };

//   return (
//     <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen  shadow-md rounded-lg">
//       <h2 className="text-2xl font-semibold mb-6 text-center">Upload Project</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <input name="project_title" placeholder="Project Title" required onChange={handleChange} className="w-full border rounded-lg p-2" />
//         <textarea name="project_details" placeholder="Project Details" required onChange={handleChange} className="w-full border rounded-lg p-2" />

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <select name="topic_id_fk" required onChange={handleChange} className="w-full border rounded-lg p-2">
//             <option value="">Select Topic</option>
//             {topics.map((t) => (
//               <option key={t.id} value={t.id}>{t.label}</option>
//             ))}
//           </select>
//           <input name="other_topic" placeholder="Other Topic (optional)" onChange={handleChange} className="w-full border rounded-lg p-2" />
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <select name="project_language" required onChange={handleChange} className="w-full border rounded-lg p-2">
//             <option value="">Select Language</option>
//             {languages.map((l) => (
//               <option key={l.id} value={l.label}>{l.label}</option>
//             ))}
//           </select>
//           <select name="file_type_id_fk" required onChange={handleChange} className="w-full border rounded-lg p-2">
//             <option value="">Select File Type</option>
//             {fileTypes.map((f) => (
//               <option key={f.id} value={f.id}>{f.label}</option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <select name="subject_id_fk" required onChange={handleChange} className="w-full border rounded-lg p-2">
//             <option value="">Select Subject</option>
//             {subjects.map((s) => (
//               <option key={s.id} value={s.id}>{s.label}</option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block mb-1 font-medium">Project File (required)</label>
//           <input type="file" required onChange={(e) => setProjectFile(e.target.files?.[0] || null)} className="w-full" />
//         </div>

//         <div>
//           <label className="block mb-1 font-medium">Project Thumbnail (optional)</label>
//           <input type="file" onChange={(e) => setProjectThumbnail(e.target.files?.[0] || null)} className="w-full" />
//         </div>

//         <div className="flex items-center">
//           <input type="checkbox" id="confirm" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mr-2" />
//           <label htmlFor="confirm" className="text-sm">I confirm that the information provided is correct.</label>
//         </div>

//         <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition">
//           Upload
//         </button>
//       </form>
//     </div>
//   );
// };

// export default UploadProject;








