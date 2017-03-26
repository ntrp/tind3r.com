import React from 'react';
import { observer, inject } from 'mobx-react'
import CSSModules from 'react-css-modules';
import styles from './Loader.scss'

export default inject('currentUser')(observer(CSSModules(({ currentUser, isSimpleLoader, noAnimation, percent }) => {
  const pulse = (
    currentUser.photos ? <img src={currentUser.photos[0].url} alt="avatar" /> : null
  )

  return (
    <div>
      {!isSimpleLoader && <div
        styleName="containter"
        className={noAnimation && 'no-animation'}
      >
        <div styleName="dot" />
        {!currentUser.isLoading && pulse && <div styleName="pulse">
          {pulse}
        </div>}
      </div>}

      {
        isSimpleLoader &&
        <div styleName="percent">
          <div styleName="simple-loader" />
          {percent && <span>{percent}%</span>}
        </div>
      }
    </div>
  )
}, styles)))
