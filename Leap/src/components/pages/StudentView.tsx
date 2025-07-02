import axios from "axios";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import * as XLSX from "xlsx";

interface QuizDataRow {
  student_id_fk: number;
  question_id: number;
  name: string;
  quiz_id: number;
  attempt_id: number;
  attempt_date: string;
  attempt_type: "pre" | "post";
  score: number;
  response_text: string;
  is_correct: number; // 1 or 0
}

const COLORS = ["#00C49F", "#FF6B6B"];

const StudentView = () => {
  const [data, setData] = useState<QuizDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [correctPercent, setCorrectPercent] = useState(0);

  useEffect(() => {
    axios
      .get("/api/quizzes/quiz-data")
      .then((res) => {
        setData(res.data);
        setLoading(false);

        const correct = res.data.filter((item: QuizDataRow) => item.is_correct === 1).length;
        const incorrect = res.data.filter((item: QuizDataRow) => item.is_correct === 0).length;
        const total = correct + incorrect;
        const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

        setCorrectPercent(percent);
        setChartData([
          { name: "Correct", value: correct },
          { name: "Incorrect", value: incorrect },
        ]);
      })
      .catch((err) => {
        console.error("Failed to load quiz data", err);
        setLoading(false);
      });
  }, []);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((row) => ({
        Student: row.name,
        "Student ID": row.student_id_fk,
        "Quiz ID": row.quiz_id,
        "Question ID": row.question_id,
        "Attempt Type": row.attempt_type,
        Score: row.score,
        "Response Text": row.response_text,
        "Answers Correct": row.is_correct === 1 ? "true" : "false",
        "Attempt Date": new Date(row.attempt_date).toLocaleString(),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Performance");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "student_quiz_performance.xlsx");
  };

  return (
    <div className="p-6 m-4 border border-gray-300 rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Student Quiz Performance</h2>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
        >
          Download Excel
        </button>
      </div>



      {/* ✅ Table Section */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Student</th>
                <th className="border px-4 py-2">Quiz ID</th>
                <th className="border px-4 py-2">Question ID</th>
                <th className="border px-4 py-2">Attempt Type</th>
                <th className="border px-4 py-2">Total Score</th>
                <th className="border px-4 py-2">Response</th>
                <th className="border px-4 py-2">Answers Correct</th>
                <th className="border px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border px-4 py-2">{row.name}</td>
                  <td className="border px-4 py-2">{row.quiz_id}</td>
                  <td className="border px-4 py-2">{row.question_id}</td>
                  <td className="border px-4 py-2">{row.attempt_type}</td>
                  <td className="border px-4 py-2">{row.score}</td>
                  <td className="border px-4 py-2">{row.response_text}</td>
                  <td
                    className={`border px-4 py-2 ${row.is_correct === 1 ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {row.is_correct === 1 ? "True" : "False"}
                  </td>
                  <td className="border px-4 py-2">
                    {new Date(row.attempt_date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ✅ Chart Section: Progress Graph (left) + Pie Chart (right) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
        {/* Left: Progress Graph */}
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Correct Answer Progress</h3>
          <div className="w-full max-w-sm bg-gray-200 rounded-full h-6">
            <div
              className="bg-green-500 h-6 rounded-full text-white text-sm text-center transition-all duration-500"
              style={{ width: `${correctPercent}%` }}
            >
              {correctPercent}%
            </div>
          </div>
        </div>

        {/* Right: Pie Chart */}
        <div className="w-full md:w-1/2">
          <h3 className="text-lg font-semibold text-center mb-2">Overall Answer Accuracy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StudentView;




// import axios from "axios";
// import { saveAs } from "file-saver";
// import { useEffect, useState } from "react";
// import * as XLSX from "xlsx";

// interface QuizDataRow {
//   student_id_fk: number;
//   question_id: number;
//   name: string;
//   quiz_id: number;
//   attempt_id: number;
//   attempt_date: string;
//   attempt_type: "pre" | "post";
//   score: number;
//   response_text: string;
//   is_correct: number; // 1 or 0
// }

// const StudentView = () => {
//   const [data, setData] = useState<QuizDataRow[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     axios
//       .get("/api/quizzes/quiz-data")
//       .then((res) => {
//         setData(res.data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Failed to load quiz data", err);
//         setLoading(false);
//       });
//   }, []);

//   const exportToExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(
//       data.map((row) => ({
//         Student: row.name,
//         "Student ID": row.student_id_fk,
//         "Quiz ID": row.quiz_id,
//         "Question ID": row.question_id,
//         "Attempt Type": row.attempt_type,
//          Score: row.score,
//         "Response Text": row.response_text,
//         "Answers Correct": row.is_correct === 1 ? "true" : "false",
//         "Attempt Date": new Date(row.attempt_date).toLocaleString(),
//       }))
//     );

//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Quiz Performance");
//     const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
//     const file = new Blob([excelBuffer], { type: "application/octet-stream" });
//     saveAs(file, "student_quiz_performance.xlsx");
//   };

//   return (
//     <div className="p-6 m-4 border border-gray-300 rounded-lg shadow-md bg-white">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold">Student Quiz Performance</h2>
//         <button
//           onClick={exportToExcel}
//           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
//         >
//           Download Excel
//         </button>
//       </div>

//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <div className="overflow-auto">
//           <table className="min-w-full border border-gray-300">
//             <thead className="bg-gray-100">
//               <tr>
//                 <th className="border px-4 py-2">Student</th>
//                 <th className="border px-4 py-2">Quiz ID</th>
//                 <th className="border px-4 py-2">Question ID</th>
//                 <th className="border px-4 py-2">Attempt Type</th>
//                 <th className="border px-4 py-2"> Total Score</th>
//                 <th className="border px-4 py-2">Response</th>
//                 <th className="border px-4 py-2">Answers Correct</th>
//                 <th className="border px-4 py-2">Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {data.map((row, index) => (
//                 <tr key={index} className="text-center">
//                   <td className="border px-4 py-2">{row.name}</td>
//                   <td className="border px-4 py-2">{row.quiz_id}</td>
//                   <td className="border px-4 py-2">{row.question_id}</td>
//                   <td className="border px-4 py-2">{row.attempt_type}</td>
//                   <td className="border px-4 py-2">{row.score}</td>
//                   <td className="border px-4 py-2">{row.response_text}</td>
//                   <td
//                     className={`border px-4 py-2 ${
//                       row.is_correct === 1 ? "text-green-600" : "text-red-600"
//                     }`}
//                   >
//                     {row.is_correct === 1 ? "true" : "false"}
//                   </td>
//                   <td className="border px-4 py-2">
//                     {new Date(row.attempt_date).toLocaleString()}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StudentView;
