import React, { useState, useEffect } from 'react';
import useMeasure  from 'react-use-measure';

const MeasureWrapper = (props) => {
  const [ref, bounds] = useMeasure();

  return (
    <div ref={ref}>
      {props.children(bounds)}
    </div>
  );
};

export default MeasureWrapper;
