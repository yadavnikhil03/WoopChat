import React from "react";

const AppWrapper = ({ children }) => {
  return (
    <div className="h-screen w-full overflow-hidden">
      {children}
    </div>
  );
};

export default AppWrapper;
