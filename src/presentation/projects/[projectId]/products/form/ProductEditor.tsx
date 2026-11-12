'use client';

import { useProductForm } from '../hooks/useProductForm';
import { AttributesSection } from './sections/AttributesSection';
import { InventorySection } from './sections/InventorySection';
import { MainSection } from './sections/MainSection';
import { MediaSection } from './sections/MediaSection';
import { OrganizationSection } from './sections/OrganizationSection';
import { PricingSection } from './sections/PricingSection';
import { StatusSection } from './sections/StatusSection';
import { StorefrontSection } from './sections/StorefrontSection';
import { VariantsSection } from './sections/VariantsSection';

interface ProductEditorProps {
    projectId: string;
    isNew: boolean;
}

export const ProductEditor = ({ projectId, isNew }: ProductEditorProps) => {
    const { isService, categoryOptions, badgeOptions, onTypeChange } = useProductForm(projectId);

    return (
        <div className="@container">
            <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="grid min-w-0 content-start gap-4">
                    <MainSection />
                    <MediaSection projectId={projectId} />
                    <PricingSection />
                    {!isService && <VariantsSection />}
                    {!isService && <AttributesSection />}
                </div>
                <div className="grid min-w-0 content-start gap-4">
                    <StatusSection />
                    <OrganizationSection
                        categoryOptions={categoryOptions}
                        badgeOptions={badgeOptions}
                        onTypeChange={onTypeChange}
                    />
                    <InventorySection withStock={isNew && !isService} />
                    <StorefrontSection />
                </div>
            </div>
        </div>
    );
};
