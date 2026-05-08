'use client';
import { configureBoneyard } from 'boneyard-js/react';
import 'src/ui/modules/bones/registry';

configureBoneyard({
  animate: 'shimmer',
  color: '#fff8ee',
  darkColor: '#1e1914',
  shimmerColor: '#fffdf8',
  darkShimmerColor: '#241e18',
  boneClass: 'boneyard-bordered',
  transition: true,
});

export function BonesProvider() {
  return null;
}
