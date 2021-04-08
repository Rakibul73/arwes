import { HTMLAttributes, CSSProperties, FC, useRef, useEffect, useMemo } from 'react';
import { jsx } from '@emotion/react';
import PropTypes from 'prop-types';
import anime from 'animejs';
import {
  ENTERING,
  ENTERED,
  EXITING,
  EXITED,
  useAnimator
} from '@arwes/animation';

interface AnimatedSettingsTransitionFunctionParams {
  targets: anime.AnimeAnimParams['targets']
  duration: number
  delay?: number
}

type AnimatedSettingsTransitionFunction = (params: AnimatedSettingsTransitionFunctionParams) => void;

// TODO: Use a stronger typing for anime parameters instead of "anime.AnimeParams".
type AnimatedSettingsTransitionTypes = AnimatedSettingsTransitionFunction | anime.AnimeParams;

type AnimatedSettingsTransition = AnimatedSettingsTransitionTypes | AnimatedSettingsTransitionTypes[];

// TODO:
type AnimatedSettingsOnTransition = () => void;

// TODO:
type AnimatedSettingsOnLifecycle = () => void;

interface AnimatedSettings {
  initialStyle?: CSSProperties

  entering?: AnimatedSettingsTransition
  exiting?: AnimatedSettingsTransition

  onEntering?: AnimatedSettingsOnTransition
  onEntered?: AnimatedSettingsOnTransition
  onExiting?: AnimatedSettingsOnTransition
  onExited?: AnimatedSettingsOnTransition

  onMount?: AnimatedSettingsOnLifecycle
  onUnmount?: AnimatedSettingsOnLifecycle
}

// TODO: Set proper HTML element typings according to "as" prop value.
// For now, all animated elements are asumed to be DIV elements.
interface AnimatedProps extends HTMLAttributes<HTMLDivElement> {
  as?: keyof HTMLElementTagNameMap
  animated?: AnimatedSettings
  className?: string
  style?: CSSProperties
}

const Animated: FC<AnimatedProps> = props => {
  const {
    as: asProvided,
    animated,
    className,
    style,
    children,
    ...otherProps
  } = props;

  const as = useMemo(() => asProvided || 'div', []);
  const rootRef = useRef<HTMLDivElement>();
  const animator = useAnimator();

  const dynamicStyle = animator?.animate
    ? animated?.initialStyle
    : null;

  useEffect(() => {
    animated?.onMount?.();

    return () => {
      anime.remove(rootRef.current as HTMLDivElement);
      animated?.onUnmount?.();
    };
  }, []);

  useEffect(() => {
    if (!animator || !animator.animate || !animated) {
      return;
    }

    switch (animator.flow.value) {
      case ENTERING: {
        if (animated.entering) {
          const animationParams = {
            targets: rootRef.current,
            duration: animator.duration.enter
          };

          const animations: AnimatedSettingsTransitionTypes[] =
            Array.isArray(animated.entering)
              ? animated.entering
              : [animated.entering];

          animations.forEach(animation => {
            if (typeof animation === 'function') {
              animation(animationParams);
            }
            else {
              anime({
                easing: 'easeOutSine',
                ...animation,
                targets: rootRef.current,
                duration: animator.duration.enter
              });
            }
          });
        }

        animated.onEntering?.();

        break;
      }

      case ENTERED: {
        animated.onEntered?.();
        break;
      }

      case EXITING: {
        if (animated.exiting) {
          const animationParams = {
            targets: rootRef.current,
            duration: animator.duration.exit
          };

          const animations: AnimatedSettingsTransitionTypes[] =
            Array.isArray(animated.exiting)
              ? animated.exiting
              : [animated.exiting];

          animations.forEach(animation => {
            if (typeof animation === 'function') {
              animation(animationParams);
            }
            else {
              anime({
                easing: 'easeOutSine',
                ...animation,
                targets: rootRef.current,
                duration: animator.duration.exit
              });
            }
          });
        }

        animated.onExiting?.();

        break;
      }

      case EXITED: {
        animated.onExited?.();
        break;
      }
    }
  }, [animator?.flow]);

  return jsx(as, {
    ...otherProps,
    className,
    style: {
      ...style,
      ...dynamicStyle
    },
    ref: rootRef
  }, children);
};

Animated.propTypes = {
  // @ts-expect-error
  as: PropTypes.string.isRequired,
  // @ts-expect-error
  animated: PropTypes.shape({
    initialStyle: PropTypes.object,
    entering: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
      PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.func,
          PropTypes.object
        ])
      )
    ]),
    exiting: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.object,
      PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.func,
          PropTypes.object
        ])
      )
    ]),
    onEntering: PropTypes.func,
    onEntered: PropTypes.func,
    onExiting: PropTypes.func,
    onExited: PropTypes.func,
    onMount: PropTypes.func,
    onUnmount: PropTypes.func
  })
};

Animated.defaultProps = {
  as: 'div'
};

export {
  AnimatedSettingsTransitionFunctionParams,
  AnimatedSettingsTransitionFunction,
  AnimatedSettingsTransition,
  AnimatedProps,
  Animated
};
