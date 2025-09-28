import React from "react";
import { ChakraProvider, Box } from "@chakra-ui/react";
import VideoFeed from "./VideoFeed";

function App() {
  return (
    <ChakraProvider>
      <Box bg="black" height="100vh" overflow="hidden">
        <VideoFeed />
      </Box>
    </ChakraProvider>
  );
}

export default App;
