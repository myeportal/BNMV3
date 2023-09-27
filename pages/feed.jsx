import React from "react";
import Rightbar from "../components/Rightbar";
import PostInFeed from "../components/PostInFeed";

const Feed = () => {
  return (
    <>
      <div className="flex justify-between">
        <div className="w-3/4">
          <div className="mainWindow p-4">
            <div className="postContent">
              <PostInFeed />
            </div>
          </div>
        </div>
        <div className="w-1/4">
          <div className="rightBar">
            <Rightbar />
          </div>
        </div>
      </div>
    </>
  );
};

export default Feed;
