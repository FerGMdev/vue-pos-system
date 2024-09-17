import { generateClasses } from "@formkit/themes";

const config = {
  config: {
    classes: generateClasses({
      global: {
        label: "block mb-2 font-bold",
        message: "text-red-500",
        wrapper: "space-y-2 mb-4",
        input:
          "border border-gray-300 rounded-md p-2 w-full border-gray-300 focus:border-green-500 focus:outline-none",
        placeholder: "text-gray-400",
      },
      file: {
        noFiles: "block text-gray-400 my-2",
        fileItem: "hidden",
      },
      submit: {
        input:
          "$reset bg-green-600 text-white rounded-md p-2 w-full hover:bg-green-700 uppercase font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
      },
    }),
  },
};

export default config;
