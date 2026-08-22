import { sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  sleep(4);
}
