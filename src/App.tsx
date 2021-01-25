import * as React from 'react';

interface Props {
  name: string;
}

const App = (props: Props): React.ReactElement => {
  const { name } = props;
  return <div>{name} Giphy Search</div>;
};

export default App;
