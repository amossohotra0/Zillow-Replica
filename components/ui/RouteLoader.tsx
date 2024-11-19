import NextTopLoader from "nextjs-toploader";

export const RouteLoader = () => {
  return (
    <NextTopLoader
      color="#2b7fff"
      initialPosition={0.08}
      crawlSpeed={200}
      height={2}
      crawl={true}
      showSpinner={true}
      easing="ease"
      speed={200}
      shadow="0 0 10px #2299DD,0 0 5px #2299DD"
    />
  );
};
