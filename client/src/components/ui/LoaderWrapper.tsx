interface LoaderWrapperProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

const LoaderWrapper: React.FC<LoaderWrapperProps> = ({
  isLoading,
  skeleton,
  children,
}) => {
  return <>{isLoading ? skeleton : children}</>;
};

export default LoaderWrapper;
