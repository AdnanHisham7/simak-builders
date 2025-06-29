export const getRandomDarkColor = () => {
  const darkColors = [
    "bg-gray-700",
    "bg-gray-800",
    "bg-gray-900",
    "bg-blue-700",
    "bg-blue-800",
    "bg-blue-900",
    "bg-purple-700",
    "bg-purple-800",
    "bg-purple-900",
    "bg-indigo-700",
    "bg-indigo-800",
    "bg-indigo-900",
  ];
  return darkColors[Math.floor(Math.random() * darkColors.length)];
};

export const getInitials = (name: string) => {
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0][0].toUpperCase();
  } else {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
};
