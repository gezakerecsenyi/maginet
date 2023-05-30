import ComponentInstanceFactory from '../../render/ComponentInstanceFactory';

export default function getInstanceId(instance: ComponentInstanceFactory<any>) {
    return `${instance.id}-${instance.component.id}`;
}