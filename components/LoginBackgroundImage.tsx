import React, { Component } from 'react';

type BackgroundImageProps = {
  children?: React.ReactNode;
};

class BackgroundImage extends Component<BackgroundImageProps> {
  render() {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img
          src="https://doc-08-2c-docs.googleusercontent.com/docs/securesc/68c90smiglihng9534mvqmq1946dmis5/fo0picsp1nhiucmc0l25s29respgpr4j/1631524275000/03522360960922298374/03522360960922298374/1Sx0jhdpEpnNIydS4rnN4kHSJtU1EyWka?e=view&authuser=0&nonce=gcrocepgbb17m&user=03522360960922298374&hash=tfhgbs86ka6divo3llbvp93mg4csvb38"
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: -1,
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default BackgroundImage;
