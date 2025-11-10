import { Vector3 } from 'three';

/**
 * Converts an array of numbers to a Vector3
 */
export function vectorArrayToVector3(arr: [number, number, number]): Vector3 {
  return new Vector3(arr[0], arr[1], arr[2]);
}
