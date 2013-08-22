#!/bin/bash

#####################################################
#
#  Run this file to pull JSZhuyin from upstream.
#  Should be replaced once Gaia got |repo| power.
#
#  The upstream code is hosted at
#  https://github.com/timdream/jszhuyin
#
#####################################################

cd `dirname $0`

if [ -z $JSZHUYIN_DIR ]; then
  echo 'Error: Please specify JSZHUYIN_DIR.'
  exit
fi

if [ ! -d $JSZHUYIN_DIR/lib ]; then
  echo 'Error: JSZhuyin file not found.'
  exit
fi

if [ ! -d $JSZHUYIN_DIR/data ]; then
  echo 'Error: No JSZhuyin data. Did you run make to generate the database there?'
  exit
fi

echo 'Copying JSZhuyin code and data to Gaia ...'

rm -rf ./lib ./data
cp -r $JSZHUYIN_DIR/lib ./lib
cp -r $JSZHUYIN_DIR/data ./data

echo 'Done.'
