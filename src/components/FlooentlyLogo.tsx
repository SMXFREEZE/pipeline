import { Img, staticFile } from "remotion";

type FlooentlyLogoProps = {
  className?: string;
};

export const FlooentlyLogo = ({ className }: FlooentlyLogoProps) => {
  return (
    <Img
      alt=""
      className={className}
      src={staticFile("flooently-logo.svg")}
    />
  );
};
