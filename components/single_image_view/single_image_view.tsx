// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import classNames from 'classnames';

import {getFilePreviewUrl, getFileUrl} from 'mattermost-redux/utils/file_utils';
import {FileInfo} from 'mattermost-redux/types/files';

import SizeAwareImage from 'components/size_aware_image';
import {FileTypes, ModalIdentifiers} from 'utils/constants';
import {
    getFileType,
} from 'utils/utils';

import FilePreviewModal from 'components/file_preview_modal';

import type {PropsFromRedux} from './index';

const PREVIEW_IMAGE_MIN_DIMENSION = 50;

interface Props extends PropsFromRedux {
    postId: string;
    fileInfo: FileInfo;
    isRhsOpen: boolean;
    compactDisplay?: boolean;
    isEmbedVisible?: boolean;
}

type State = {
    loaded: boolean;
    dimensions: {
        width: number;
        height: number;
    };
}

export default class SingleImageView extends React.PureComponent<Props, State> {
    private mounted: boolean;
    static defaultProps = {
        compactDisplay: false,
    };

    constructor(props: Props) {
        super(props);
        this.mounted = true;
        this.state = {
            loaded: false,
            dimensions: {
                width: props.fileInfo?.width || 0,
                height: props.fileInfo?.height || 0,
            },
        };
    }

    componentDidMount() {
        this.mounted = true;
    }

    static getDerivedStateFromProps(props: Props, state: State) {
        if ((props.fileInfo?.width !== state.dimensions.width) || props.fileInfo.height !== state.dimensions.height) {
            return {
                dimensions: {
                    width: props.fileInfo?.width,
                    height: props.fileInfo?.height,
                },
            };
        }
        return null;
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    imageLoaded = () => {
        if (this.mounted) {
            this.setState({loaded: true});
        }
    }

    handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        this.props.actions.openModal({
            modalId: ModalIdentifiers.FILE_PREVIEW_MODAL,
            dialogType: FilePreviewModal,
            dialogProps: {
                fileInfos: [this.props.fileInfo],
                postId: this.props.postId,
            },
        });
    }

    toggleEmbedVisibility = () => {
        this.props.actions.toggleEmbedVisibility(this.props.postId);
    }

    render() {
        const {fileInfo, compactDisplay} = this.props;
        const {
            loaded,
        } = this.state;

        if (fileInfo === undefined) {
            return <></>;
        }

        const {has_preview_image: hasPreviewImage, id} = fileInfo;
        const fileURL = getFileUrl(id);
        const previewURL = hasPreviewImage ? getFilePreviewUrl(id) : fileURL;

        const previewHeight = fileInfo.height;
        const previewWidth = fileInfo.width;

        let minPreviewClass = '';
        if (
            previewWidth < PREVIEW_IMAGE_MIN_DIMENSION ||
            previewHeight < PREVIEW_IMAGE_MIN_DIMENSION
        ) {
            minPreviewClass = 'min-preview ';

            if (previewHeight > previewWidth) {
                minPreviewClass += 'min-preview--portrait ';
            }
        }

        // Add compact display class to image class if in compact mode
        if (compactDisplay) {
            minPreviewClass += ' compact-display';
        }

        const toggle = (
            <button
                key='toggle'
                className='style--none single-image-view__toggle'
                data-expanded={this.props.isEmbedVisible}
                aria-label='Toggle Embed Visibility'
                onClick={this.toggleEmbedVisibility}
            >
                <span
                    className={classNames('icon', {
                        'icon-menu-down': this.props.isEmbedVisible,
                        'icon-menu-right': !this.props.isEmbedVisible,
                    })}
                />
            </button>
        );

        const fileHeader = (
            <div
                className={classNames('image-header', {
                    'image-header--expanded': this.props.isEmbedVisible,
                })}
            >
                {toggle}
                {!this.props.isEmbedVisible && (
                    <div
                        data-testid='image-name'
                        className={classNames('image-name', {
                            'compact-display': compactDisplay,
                        })}
                    >
                        <div onClick={this.handleImageClick}>
                            {fileInfo.name}
                        </div>
                    </div>
                )}
            </div>
        );

        let fadeInClass = '';

        const fileType = getFileType(fileInfo.extension);
        let styleIfSvgWithDimensions = {};
        let imageContainerStyle = {};
        let svgClass = '';
        if (fileType === FileTypes.SVG) {
            svgClass = 'svg';
            if (this.state.dimensions.height) {
                styleIfSvgWithDimensions = {
                    width: '100%',
                };
            } else {
                imageContainerStyle = {
                    height: 350,
                    maxWidth: '100%',
                };
            }
        }

        if (loaded) {
            fadeInClass = 'image-fade-in';
        }

        return (
            <div
                className='file-view--single'
            >
                <div
                    className='file__image'
                >
                    {fileHeader}
                    {this.props.isEmbedVisible &&
                    <div
                        className='image-container'
                        style={imageContainerStyle}
                    >
                        <div
                            className={classNames('image-loaded', fadeInClass, svgClass)}
                            style={styleIfSvgWithDimensions}
                        >
                            <SizeAwareImage
                                onClick={this.handleImageClick}
                                className={minPreviewClass}
                                src={previewURL}
                                dimensions={this.state.dimensions}
                                fileInfo={this.props.fileInfo}
                                onImageLoaded={this.imageLoaded}
                                showLoader={this.props.isEmbedVisible}
                                handleSmallImageContainer={true}
                            />
                        </div>
                    </div>
                    }
                </div>
            </div>
        );
    }
}
