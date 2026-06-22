import { Redirect } from 'expo-router';

/** Dev client mở scheme `mmasl13demo:///` — redirect về tab dashboard */
export default function Index() {
  return <Redirect href="/(tabs)/" />;
}
