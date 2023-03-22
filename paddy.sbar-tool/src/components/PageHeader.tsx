import React from "react";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
}

export default function PageHeader(props: PageHeaderProps): JSX.Element {

  return <>
    <h1>{props.title}</h1>
    {props.subtitle && props.subtitle.length > 0 && <h2>{props.subtitle}</h2>}
  </>;
}
